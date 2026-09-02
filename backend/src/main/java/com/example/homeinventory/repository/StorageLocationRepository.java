package com.example.homeinventory.repository;

import com.example.homeinventory.entity.StorageLocation;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StorageLocationRepository extends JpaRepository<StorageLocation, Long> {
    List<StorageLocation> findByHouseholdIdOrderByNameAsc(Long householdId);
    List<StorageLocation> findByRoomIdAndHouseholdIdOrderByNameAsc(Long roomId, Long householdId);
    java.util.Optional<StorageLocation> findByIdAndHouseholdId(Long id, Long householdId);
}
