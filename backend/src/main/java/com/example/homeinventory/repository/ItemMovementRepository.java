package com.example.homeinventory.repository;

import com.example.homeinventory.entity.ItemMovement;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ItemMovementRepository extends JpaRepository<ItemMovement, Long> {
    List<ItemMovement> findByHouseholdIdOrderByMovedAtDescIdDesc(Long householdId);
}
