package com.testops.api.converter;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.testops.api.dto.ChecklistItem;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.ArrayList;
import java.util.List;

@Converter
public class ChecklistItemListConverter implements AttributeConverter<List<ChecklistItem>, String> {

    private static final ObjectMapper mapper = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(List<ChecklistItem> list) {
        try {
            if (list == null) return "[]";
            return mapper.writeValueAsString(list);
        } catch (Exception e) {
            return "[]";
        }
    }

    @Override
    public List<ChecklistItem> convertToEntityAttribute(String json) {
        try {
            if (json == null || json.isBlank()) return new ArrayList<>();
            return mapper.readValue(json, new TypeReference<List<ChecklistItem>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }
}
