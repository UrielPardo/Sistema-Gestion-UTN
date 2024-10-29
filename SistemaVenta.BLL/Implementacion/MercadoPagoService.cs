using MercadoPago.Client.Payment;
using MercadoPago.Config;
using MercadoPago.Resource.Payment;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;

public class MercadoPagoService
{
    private readonly IConfiguration _configuration;

    public MercadoPagoService(IConfiguration configuration)
    {
        _configuration = configuration;
        MercadoPagoConfig.AccessToken = _configuration["MercadoPagoConfig:AccessToken"];
    }

    public async Task<Payment> CreatePaymentAsync(decimal amount, string description, string token, string email)
    {
        var paymentRequest = new PaymentCreateRequest
        {
            TransactionAmount = amount,
            Token = token,
            Description = description,
            Installments = 1,
            PaymentMethodId = "visa", // Cambia según el método de pago
            Payer = new PaymentPayerRequest
            {
                Email = email,
            }
        };

        var client = new PaymentClient();
        return await client.CreateAsync(paymentRequest);
    }
}