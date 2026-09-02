package com.example.homeinventory.repository;

import com.example.homeinventory.entity.Item;
import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ItemRepository extends JpaRepository<Item, Long> {
    List<Item> findByHouseholdIdOrderByNameAsc(Long householdId);
    List<Item> findByHouseholdIdAndNameContainingIgnoreCaseOrderByNameAsc(Long householdId, String name);
    List<Item> findByHouseholdIdAndRoomIdOrderByNameAsc(Long householdId, Long roomId);
    List<Item> findByHouseholdIdAndCategoryIdOrderByNameAsc(Long householdId, Long categoryId);
    List<Item> findByHouseholdIdAndRoomIdAndCategoryIdOrderByNameAsc(
            Long householdId, Long roomId, Long categoryId);
    List<Item> findByHouseholdIdAndStorageLocationIdOrderByNameAsc(Long householdId, Long storageLocationId);
    List<Item> findByIdInAndHouseholdId(Collection<Long> ids, Long householdId);
    java.util.Optional<Item> findByIdAndHouseholdId(Long id, Long householdId);
    long countByHouseholdId(Long householdId);
    long countByHouseholdIdAndRoomId(Long householdId, Long roomId);
    long countByHouseholdIdAndCategoryId(Long householdId, Long categoryId);
    long countByHouseholdIdAndStorageLocationId(Long householdId, Long storageLocationId);

    @Query("select coalesce(sum(i.estimatedValue * i.quantity), 0) from Item i where i.household.id = :householdId")
    BigDecimal totalEstimatedValue(Long householdId);
}
