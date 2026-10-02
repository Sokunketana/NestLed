package com.example.homeinventory.service;

import com.example.homeinventory.entity.Category;
import com.example.homeinventory.entity.Household;
import com.example.homeinventory.entity.Item;
import com.example.homeinventory.entity.ItemCondition;
import com.example.homeinventory.entity.Room;
import com.example.homeinventory.repository.ItemRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.PageRequest;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest(properties = {"spring.config.import=", "spring.sql.init.mode=never",
        "spring.jpa.hibernate.ddl-auto=create-drop"}, showSql = false)
class ItemSearchRepositoryTest {
    @Autowired TestEntityManager entities;
    @Autowired ItemRepository items;

    @Test
    void searchLimitsResultsAndPagesStablyWithinTheHousehold() {
        Household home = entities.persist(new Household("Home"));
        Household other = entities.persist(new Household("Other"));
        Room room = new Room();
        room.setName("Office");
        room.setHousehold(home);
        entities.persist(room);
        Category category = new Category();
        category.setName("Documents");
        category.setHousehold(home);
        entities.persist(category);
        Item first = item(home, room, category, "Passport");
        Item second = item(home, room, category, "Passport");
        Item third = item(home, room, category, "Passports");
        item(home, room, category, "Unrelated");
        item(other, room, category, "Passport");
        entities.flush();
        entities.clear();

        var page0 = items.findByHouseholdIdAndNameContainingIgnoreCaseOrderByNameAscIdAsc(
                home.getId(), "pAsS", PageRequest.of(0, 2));
        var page1 = items.findByHouseholdIdAndNameContainingIgnoreCaseOrderByNameAscIdAsc(
                home.getId(), "pAsS", PageRequest.of(1, 2));
        var page2 = items.findByHouseholdIdAndNameContainingIgnoreCaseOrderByNameAscIdAsc(
                home.getId(), "pAsS", PageRequest.of(2, 2));

        assertEquals(java.util.List.of(first.getId(), second.getId()),
                page0.stream().map(Item::getId).toList());
        assertTrue(page0.hasNext());
        assertEquals(java.util.List.of(third.getId()), page1.stream().map(Item::getId).toList());
        assertFalse(page1.hasNext());
        assertTrue(page2.isEmpty());
        assertFalse(page2.hasNext());
    }

    private Item item(Household home, Room room, Category category, String name) {
        Item item = new Item();
        item.setHousehold(home);
        item.setRoom(room);
        item.setCategory(category);
        item.setName(name);
        item.setQuantity(1);
        item.setCondition(ItemCondition.GOOD);
        return entities.persist(item);
    }
}
