package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// AuthMiddleware verifica que la petición tenga un JWT válido.
//
// ¿Cómo funciona?
// 1. El frontend envía el token en el header: "Authorization: Bearer <token>"
// 2. Este middleware extrae el token, lo verifica con el secreto JWT
// 3. Si es válido, extrae el user_id y lo pone en el contexto de Gin
// 4. Los handlers pueden luego obtener el user_id con c.GetString("user_id")
// 5. Si el token es inválido o no existe, devuelve 401 (no autorizado)
//
// Esto asegura que cada usuario solo vea SUS datos.
func AuthMiddleware(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Obtener el header Authorization
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, ErrorResponse{
				Error:   "no_autorizado",
				Message: "Token de autenticación requerido",
			})
			c.Abort()
			return
		}

		// Verificar formato "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, ErrorResponse{
				Error:   "token_invalido",
				Message: "Formato de token inválido. Usa: Bearer <token>",
			})
			c.Abort()
			return
		}

		tokenString := parts[1]

		// Parsear y validar el JWT
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Verificar que el método de firma sea HMAC (el que usamos)
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(jwtSecret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, ErrorResponse{
				Error:   "token_invalido",
				Message: "Token expirado o inválido. Inicia sesión nuevamente.",
			})
			c.Abort()
			return
		}

		// Extraer los claims (datos dentro del token)
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, ErrorResponse{
				Error:   "token_invalido",
				Message: "No se pudo leer el token",
			})
			c.Abort()
			return
		}

		// Guardar el user_id en el contexto para que los handlers lo usen
		userID, ok := claims["user_id"].(string)
		if !ok {
			c.JSON(http.StatusUnauthorized, ErrorResponse{
				Error:   "token_invalido",
				Message: "Token sin información de usuario",
			})
			c.Abort()
			return
		}

		c.Set("user_id", userID)
		c.Next()
	}
}
