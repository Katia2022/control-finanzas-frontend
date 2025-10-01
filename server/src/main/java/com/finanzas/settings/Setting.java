package com.finanzas.settings;

import jakarta.persistence.*;

@Entity
@Table(name = "settings")
public class Setting {
    @Id
    @Column(length = 100)
    private String key;

    @Column(name = "value_json", columnDefinition = "text")
    private String valueJson;

    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }
    public String getValueJson() { return valueJson; }
    public void setValueJson(String valueJson) { this.valueJson = valueJson; }
}

