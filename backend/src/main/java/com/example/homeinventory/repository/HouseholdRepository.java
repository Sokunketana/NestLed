package com.example.homeinventory.repository;

import com.example.homeinventory.entity.Household;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HouseholdRepository extends JpaRepository<Household, Long> {
    Optional<Household> findFirstByOrderByIdAsc();
}
