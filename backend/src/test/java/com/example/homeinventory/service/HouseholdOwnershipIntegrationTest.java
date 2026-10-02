package com.example.homeinventory.service;

import com.example.homeinventory.entity.AppUser;
import com.example.homeinventory.entity.Household;
import com.example.homeinventory.entity.HouseholdMembership;
import com.example.homeinventory.entity.HouseholdRole;
import com.example.homeinventory.repository.AppUserRepository;
import com.example.homeinventory.repository.HouseholdMembershipRepository;
import com.example.homeinventory.repository.HouseholdRepository;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@DataJpaTest(properties = {"spring.config.import=", "spring.sql.init.mode=never",
        "spring.jpa.hibernate.ddl-auto=create-drop"}, showSql = false)
@Import({HouseholdService.class, AccountDeletionService.class})
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class HouseholdOwnershipIntegrationTest {
    @Autowired HouseholdService service;
    @Autowired AccountDeletionService deletion;
    @Autowired AppUserRepository users;
    @Autowired HouseholdRepository households;
    @Autowired HouseholdMembershipRepository memberships;
    @Autowired PlatformTransactionManager transactionManager;
    @MockitoBean AppUserService appUsers;
    @MockitoBean PhotoStorageService photos;

    @Test
    void formerOwnerCanDeleteAccountWhileSuccessorAndHouseholdRemain() {
        Fixture fixture = fixture();
        service.transferOwnership(fixture.principal(), fixture.memberId());

        assertEquals(HouseholdRole.MEMBER, memberships.findByUserId(fixture.ownerId()).orElseThrow().getRole());
        assertEquals(HouseholdRole.OWNER, memberships.findByUserId(fixture.memberId()).orElseThrow().getRole());
        assertEquals(HouseholdRole.MEMBER, users.findById(fixture.ownerId()).orElseThrow().getHouseholdRole());
        assertEquals(HouseholdRole.OWNER, users.findById(fixture.memberId()).orElseThrow().getHouseholdRole());

        deletion.deleteAccount(fixture.principal());

        assertFalse(users.existsById(fixture.ownerId()));
        assertTrue(users.existsById(fixture.memberId()));
        assertTrue(households.existsById(fixture.householdId()));
        assertEquals(1, memberships.countByHouseholdId(fixture.householdId()));
        assertEquals(HouseholdRole.OWNER, memberships.findByUserId(fixture.memberId()).orElseThrow().getRole());
        verifyNoInteractions(photos);
    }

    @Test
    void simultaneousTransfersCannotCreateTwoOwners() throws Exception {
        Fixture fixture = fixture();
        Long otherId = transaction().execute(status -> {
            Household household = households.findById(fixture.householdId()).orElseThrow();
            return member(household, HouseholdRole.MEMBER).getId();
        });
        CountDownLatch transferred = new CountDownLatch(1);
        CountDownLatch commit = new CountDownLatch(1);
        CountDownLatch secondStarted = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            var first = executor.submit(() -> transaction().execute(status -> {
                var result = service.transferOwnership(fixture.principal(), fixture.memberId());
                transferred.countDown();
                try {
                    assertTrue(commit.await(10, TimeUnit.SECONDS));
                } catch (InterruptedException ex) {
                    throw new IllegalStateException(ex);
                }
                return result;
            }));
            try {
                assertTrue(transferred.await(10, TimeUnit.SECONDS));
                var second = executor.submit(() -> {
                    secondStarted.countDown();
                    return assertThrows(AccessDeniedException.class,
                            () -> service.transferOwnership(fixture.principal(), otherId));
                });
                assertTrue(secondStarted.await(5, TimeUnit.SECONDS));
                assertThrows(TimeoutException.class, () -> second.get(200, TimeUnit.MILLISECONDS));
                commit.countDown();
                assertNotNull(first.get(10, TimeUnit.SECONDS));
                assertNotNull(second.get(10, TimeUnit.SECONDS));
            } finally {
                commit.countDown();
            }
        }
        assertEquals(1, memberships.findByHouseholdIdOrderByUserDisplayNameAscUserEmailAsc(fixture.householdId())
                .stream().filter(member -> member.getRole() == HouseholdRole.OWNER).count());
    }

    private Fixture fixture() {
        Fixture fixture = transaction().execute(status -> {
            Household household = households.save(new Household("Shared home"));
            AppUser owner = member(household, HouseholdRole.OWNER);
            AppUser member = member(household, HouseholdRole.MEMBER);
            return new Fixture(household.getId(), owner.getId(), member.getId(), mock(OidcUser.class));
        });
        when(appUsers.getRequired(fixture.principal()))
                .thenAnswer(invocation -> users.findById(fixture.ownerId()).orElseThrow());
        return fixture;
    }

    private AppUser member(Household household, HouseholdRole role) {
        String identity = UUID.randomUUID().toString();
        AppUser user = new AppUser("issuer", identity, identity + "@example.com", identity, null);
        user.joinHousehold(household, role);
        user = users.save(user);
        memberships.save(new HouseholdMembership(household, user, role));
        return user;
    }

    private TransactionTemplate transaction() {
        return new TransactionTemplate(transactionManager);
    }

    private record Fixture(Long householdId, Long ownerId, Long memberId, OidcUser principal) {}
}
