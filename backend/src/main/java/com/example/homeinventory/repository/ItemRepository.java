package com.example.homeinventory.repository;

import com.example.homeinventory.entity.Item;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ItemRepository extends JpaRepository<Item, Long> {
    List<Item> findByNameContainingIgnoreCaseOrderByNameAsc(String name);
    List<Item> findByRoomIdOrderByNameAsc(Long roomId);
    List<Item> findByCategoryIdOrderByNameAsc(Long categoryId);
    List<Item> findByRoomIdAndCategoryIdOrderByNameAsc(Long roomId, Long categoryId);
    List<Item> findByStorageLocationIdOrderByNameAsc(Long storageLocationId);
    long countByRoomId(Long roomId);
    long countByCategoryId(Long categoryId);
    long countByStorageLocationId(Long storageLocationId);

    @Query("select coalesce(sum(i.estimatedValue * i.quantity), 0) from Item i")
    BigDecimal totalEstimatedValue();
}
