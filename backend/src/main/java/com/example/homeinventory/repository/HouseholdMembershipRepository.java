package com.example.homeinventory.repository;

import com.example.homeinventory.entity.HouseholdMembership;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface HouseholdMembershipRepository extends JpaRepository<HouseholdMembership, Long> {
    // Lock before reading roles so transfer, departure and deletion cannot race.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select m from HouseholdMembership m where m.user.id = :userId")
    Optional<HouseholdMembership> findByUserIdForUpdate(Long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select m from HouseholdMembership m where m.household.id = :householdId and m.user.id = :userId")
    Optional<HouseholdMembership> findByHouseholdIdAndUserIdForUpdate(Long householdId, Long userId);

    @EntityGraph(attributePaths = {"household", "user"})
    Optional<HouseholdMembership> findByUserId(Long userId);

    @EntityGraph(attributePaths = {"household", "user"})
    List<HouseholdMembership> findByHouseholdIdOrderByUserDisplayNameAscUserEmailAsc(Long householdId);

    @EntityGraph(attributePaths = {"household", "user"})
    Optional<HouseholdMembership> findByHouseholdIdAndUserId(Long householdId, Long userId);

    @EntityGraph(attributePaths = {"household", "user"})
    Optional<HouseholdMembership> findByUserIdAndHouseholdId(Long userId, Long householdId);

    boolean existsByHouseholdIdAndUserEmailIgnoreCase(Long householdId, String email);

    long countByHouseholdId(Long householdId);
}
