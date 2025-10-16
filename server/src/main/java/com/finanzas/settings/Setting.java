package com.finanzas.settings;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Entity
@Table(name = "settings")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString
public class Setting {
    @Id
    @Column(length = 100)
    private String key;

    @Column(name = "value_json", columnDefinition = "text")
    private String valueJson;
}
