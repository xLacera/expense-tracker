package handlers

import (
	"net/http"

	"expense-tracker-backend/internal/models"
	"expense-tracker-backend/internal/services"

	"github.com/gin-gonic/gin"
)

type CategoryHandler struct {
	categoryService *services.CategoryService
}

func NewCategoryHandler(categoryService *services.CategoryService) *CategoryHandler {
	return &CategoryHandler{categoryService: categoryService}
}

// GetAll maneja GET /api/categories
// Devuelve todas las categorías del usuario autenticado.
func (h *CategoryHandler) GetAll(c *gin.Context) {
	userID := c.GetString("user_id") // Viene del middleware de auth

	categories, err := h.categoryService.GetAll(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "error_servidor",
			"message": "Error obteniendo categorías",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"categories": categories})
}

// Create maneja POST /api/categories
func (h *CategoryHandler) Create(c *gin.Context) {
	userID := c.GetString("user_id")

	var req models.CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "datos_invalidos",
			"message": "Verifica los datos: " + err.Error(),
		})
		return
	}

	category, err := h.categoryService.Create(c.Request.Context(), userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "error_creando",
			"message": "Error creando categoría: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, category)
}

// Update maneja PUT /api/categories/:id
func (h *CategoryHandler) Update(c *gin.Context) {
	userID := c.GetString("user_id")
	categoryID := c.Param("id")

	var req models.UpdateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "datos_invalidos",
			"message": "Verifica los datos: " + err.Error(),
		})
		return
	}

	category, err := h.categoryService.Update(c.Request.Context(), categoryID, userID, req)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "no_encontrada",
			"message": "Categoría no encontrada o no tienes permiso",
		})
		return
	}

	c.JSON(http.StatusOK, category)
}

// Delete maneja DELETE /api/categories/:id
func (h *CategoryHandler) Delete(c *gin.Context) {
	userID := c.GetString("user_id")
	categoryID := c.Param("id")

	err := h.categoryService.Delete(c.Request.Context(), categoryID, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "no_encontrada",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Categoría eliminada exitosamente"})
}
