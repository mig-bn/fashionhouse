package com.fashionhouse.application.port;

public interface EmailPort {

    void sendOrderConfirmation(String toEmail, String customerName, String orderId);

    void sendOrderStatusUpdate(String toEmail, String customerName,
                               String orderId, String newStatus);

    void sendQuotationReceived(String toEmail, String customerName, String quotationId);

    void sendQuotationStatusUpdate(String toEmail, String customerName,
                                   String quotationId, String newStatus);

    void sendNewMessageNotification(String toEmail, String recipientName,
                                    String quotationId);
}
