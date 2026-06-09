package com.campus.passportreservation.common;

import com.baomidou.mybatisplus.core.metadata.IPage;

import java.util.List;

public record PageResponse<T>(long page, long size, long total, List<T> records) {

    public static <T> PageResponse<T> of(IPage<?> source, List<T> records) {
        return new PageResponse<>(source.getCurrent(), source.getSize(), source.getTotal(), records);
    }
}
