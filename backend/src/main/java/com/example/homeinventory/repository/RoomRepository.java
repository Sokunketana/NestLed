package com.example.homeinventory.repository;

import com.example.homeinventory.entity.Room;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomRepository extends JpaRepository<Room, Long> {
    List<Room> findByHouseholdIdOrderByNameAsc(Long householdId);
    Optional<Room> findByIdAndHouseholdId(Long id, Long householdId);
    boolean existsByHouseholdIdAndNameIgnoreCase(Long householdId, String name);
    long countByHouseholdId(Long householdId);
}
