package com.example.userLogin.service;

import com.example.userLogin.entity.User;
import com.example.userLogin.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    @Autowired
    private UserRepository repository;

    public List<User> getAllUsers() {
        return repository.findAll();
    }

    public User getUserById(String id) {
        return repository.findById(id).orElse(null);
    }

    public User createUser(User user) {
        return repository.save(user);
    }

    public User updateUser(String id, User user) {
        User existing = repository.findById(id).orElse(null);
        if (existing != null) {
            existing.setFirstname(user.getFirstname());
            existing.setLastname(user.getLastname());
            existing.setEmail(user.getEmail());
            existing.setPhone(user.getPhone());
            return repository.save(existing);
        }
        return null;
    }

    public void deleteUser(String id) {
        repository.deleteById(id);
    }
}
