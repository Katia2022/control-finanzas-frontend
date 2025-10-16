package com.finanzas.categories;

import com.finanzas.common.ConflictException;
import com.finanzas.common.Constants;
import com.finanzas.common.NotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CategoryService {
    private final CategoryRepository repo;

    @Transactional(readOnly = true)
    public List<Category> list() {
      return repo.findAll();
    }

    @Transactional
    public Category create(String name) {
        if (repo.existsByNameIgnoreCase(name)) throw new ConflictException(Constants.ERR_CATEGORY_EXISTS);
        Category c = new Category(); c.setName(name.trim());
        return repo.save(c);
    }

    @Transactional
    public Category rename(Long id, String name) {
        Category c = repo.findById(id).orElseThrow(NotFoundException::new);
        c.setName(name.trim());
        return repo.save(c);
    }

    @Transactional
    public void delete(Long id) {
        if (!repo.existsById(id)) throw new NotFoundException();
        repo.deleteById(id);
    }
}
