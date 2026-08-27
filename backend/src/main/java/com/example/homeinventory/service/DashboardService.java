package com.example.homeinventory.service;

import com.example.homeinventory.dto.DashboardResponse;
import com.example.homeinventory.repository.CategoryRepository;
import com.example.homeinventory.repository.ItemRepository;
import com.example.homeinventory.repository.RoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class DashboardService {
    private final ItemRepository itemRepository;
    private final RoomRepository roomRepository;
    private final CategoryRepository categoryRepository;
    private final RoomService roomService;

    public DashboardService(ItemRepository itemRepository, RoomRepository roomRepository,
                            CategoryRepository categoryRepository, RoomService roomService) {
        this.itemRepository = itemRepository;
        this.roomRepository = roomRepository;
        this.categoryRepository = categoryRepository;
        this.roomService = roomService;
    }

    public DashboardResponse getDashboard() {
        return new DashboardResponse(itemRepository.count(), roomRepository.count(), categoryRepository.count(),
                itemRepository.totalEstimatedValue(), roomService.findAll());
    }
}
