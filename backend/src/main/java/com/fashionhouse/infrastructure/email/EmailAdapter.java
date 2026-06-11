package com.fashionhouse.infrastructure.email;

import com.fashionhouse.application.port.EmailPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class EmailAdapter implements EmailPort {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@fashionhouse.com}")
    private String from;

    @Override
    public void sendOrderConfirmation(String toEmail, String customerName, String orderId) {
        send(toEmail,
                "Orden confirmada — FashionHouse",
                """
                Hola %s,

                Tu orden #%s ha sido confirmada. Puedes ver el detalle en tu cuenta.

                Gracias por tu compra.
                — Equipo FashionHouse
                """.formatted(customerName, orderId));
    }

    @Override
    public void sendOrderStatusUpdate(String toEmail, String customerName,
                                      String orderId, String newStatus) {
        send(toEmail,
                "Actualización de tu orden — FashionHouse",
                """
                Hola %s,

                El estado de tu orden #%s ha cambiado a: %s

                Ingresa a tu cuenta para más detalles.
                — Equipo FashionHouse
                """.formatted(customerName, orderId, newStatus));
    }

    @Override
    public void sendQuotationReceived(String toEmail, String customerName, String quotationId) {
        send(toEmail,
                "Cotización recibida — FashionHouse",
                """
                Hola %s,

                Hemos recibido tu solicitud de cotización #%s.
                Nuestro equipo la revisará y te responderá pronto.

                — Equipo FashionHouse
                """.formatted(customerName, quotationId));
    }

    @Override
    public void sendQuotationStatusUpdate(String toEmail, String customerName,
                                          String quotationId, String newStatus) {
        send(toEmail,
                "Tu cotización ha sido actualizada — FashionHouse",
                """
                Hola %s,

                El estado de tu cotización #%s ha cambiado a: %s

                Ingresa a tu cuenta para ver los detalles y continuar la conversación.
                — Equipo FashionHouse
                """.formatted(customerName, quotationId, newStatus));
    }

    @Override
    public void sendNewMessageNotification(String toEmail, String recipientName,
                                           String quotationId) {
        send(toEmail,
                "Nuevo mensaje en tu cotización — FashionHouse",
                """
                Hola %s,

                Tienes un nuevo mensaje en tu cotización #%s.

                Ingresa a tu cuenta para responder.
                — Equipo FashionHouse
                """.formatted(recipientName, quotationId));
    }

    private void send(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
        } catch (Exception e) {
            log.warn("No se pudo enviar email a {}: {}", to, e.getMessage());
        }
    }
}
