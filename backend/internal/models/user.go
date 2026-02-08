// Package models define las estructuras de datos de la aplicación.
// Estas structs representan las tablas de la base de datos y también
// se usan para serializar/deserializar JSON en las respuestas HTTP.
package models

import "time"

// User representa un usuario registrado en la aplicación.
type User struct {
	ID           string    `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"` // El "-" hace que NUNCA se envíe en respuestas JSON
	Name         string    `json:"name"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// RegisterRequest es lo que el frontend envía para registrarse.
type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Name     string `json:"name" binding:"required,min=2"`
}

// LoginRequest es lo que el frontend envía para hacer login.
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// AuthResponse es la respuesta que recibe el frontend después de login/register.
type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}
