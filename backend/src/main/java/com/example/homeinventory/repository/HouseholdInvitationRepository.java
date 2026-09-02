package com.example.homeinventory.repository;

import com.example.homeinventory.entity.HouseholdInvitation;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HouseholdInvitationRepository extends JpaRepository<HouseholdInvitation, Long> {
    List<HouseholdInvitation> findByEmailIgnoreCaseOrderByCreatedAtAsc(String email);
    boolean existsByHouseholdIdAndEmailIgnoreCase(Long householdId, String email);
    List<HouseholdInvitation> findByHouseholdIdOrderByCreatedAtAsc(Long householdId);
}
