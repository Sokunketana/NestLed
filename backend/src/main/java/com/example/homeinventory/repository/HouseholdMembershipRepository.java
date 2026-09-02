package com.example.homeinventory.repository;

import com.example.homeinventory.entity.HouseholdMembership;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HouseholdMembershipRepository extends JpaRepository<HouseholdMembership, Long> {
    @EntityGraph(attributePaths = {"household", "user"})
    Optional<HouseholdMembership> findByUserId(Long userId);

    @EntityGraph(attributePaths = {"household", "user"})
    List<HouseholdMembership> findByHouseholdIdOrderByUserDisplayNameAscUserEmailAsc(Long householdId);

    @EntityGraph(attributePaths = {"household", "user"})
    Optional<HouseholdMembership> findByHouseholdIdAndUserId(Long householdId, Long userId);

    @EntityGraph(attributePaths = {"household", "user"})
    Optional<HouseholdMembership> findByUserIdAndHouseholdId(Long userId, Long householdId);

    boolean existsByHouseholdIdAndUserEmailIgnoreCase(Long householdId, String email);
}
