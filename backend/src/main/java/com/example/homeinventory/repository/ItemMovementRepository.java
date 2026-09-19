package com.example.homeinventory.repository;

import com.example.homeinventory.entity.ItemMovement;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ItemMovementRepository extends JpaRepository<ItemMovement, Long> {
    List<ItemMovement> findByHouseholdIdOrderByMovedAtDescIdDesc(Long householdId);
    List<ItemMovement> findTop8ByHouseholdIdOrderByMovedAtDescIdDesc(Long householdId);
    long countByHouseholdId(Long householdId);
}
