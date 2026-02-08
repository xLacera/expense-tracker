// Package email envía correos electrónicos usando la API de Resend.
// Usa net/http directamente (sin SDK) para mantener las dependencias mínimas.
// Resend ofrece 100 emails/día gratis — perfecto para nuestro caso.
package email

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// ResendService maneja el envío de emails a través de la API de Resend.
type ResendService struct {
	apiKey string
}

// NewResendService crea un nuevo servicio de email.
// apiKey es la clave de API de Resend (se obtiene en resend.com).
func NewResendService(apiKey string) *ResendService {
	return &ResendService{apiKey: apiKey}
}

// sendEmailRequest es el cuerpo que espera la API de Resend.
type sendEmailRequest struct {
	From    string   `json:"from"`
	To      []string `json:"to"`
	Subject string   `json:"subject"`
	HTML    string   `json:"html"`
}

// SendOTP envía un email con el código OTP de 6 dígitos para restablecer contraseña.
func (s *ResendService) SendOTP(toEmail, otpCode string) error {
	// HTML bonito y simple para el email
	htmlBody := fmt.Sprintf(`
		<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 400px; margin: 0 auto; padding: 40px 20px;">
			<div style="text-align: center; margin-bottom: 30px;">
				<h2 style="color: #111; margin: 0; font-size: 20px;">Expense Tracker</h2>
			</div>
			<div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 30px; text-align: center;">
				<p style="color: #374151; font-size: 14px; margin: 0 0 20px;">
					Usa este código para restablecer tu contraseña:
				</p>
				<div style="background: #111; color: #fff; font-size: 32px; font-weight: 700; letter-spacing: 8px; padding: 16px 24px; border-radius: 8px; display: inline-block;">
					%s
				</div>
				<p style="color: #6b7280; font-size: 12px; margin: 20px 0 0;">
					Este código expira en 10 minutos.<br/>
					Si no solicitaste esto, ignora este email.
				</p>
			</div>
		</div>
	`, otpCode)

	reqBody := sendEmailRequest{
		From:    "Expense Tracker <onboarding@resend.dev>",
		To:      []string{toEmail},
		Subject: fmt.Sprintf("Tu código de verificación: %s", otpCode),
		HTML:    htmlBody,
	}

	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return fmt.Errorf("error serializando email: %w", err)
	}

	req, err := http.NewRequest("POST", "https://api.resend.com/emails", bytes.NewBuffer(jsonBody))
	if err != nil {
		return fmt.Errorf("error creando request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("error enviando email: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("error de Resend (status %d): %s", resp.StatusCode, string(body))
	}

	return nil
}
