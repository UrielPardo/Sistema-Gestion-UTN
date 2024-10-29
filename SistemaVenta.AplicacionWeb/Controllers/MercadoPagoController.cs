
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

[ApiController]
[Route("api/[controller]")]
public class PaymentController : ControllerBase
{
    private readonly MercadoPagoService _mercadoPagoService;

    public PaymentController(MercadoPagoService mercadoPagoService)
    {
        _mercadoPagoService = mercadoPagoService;
    }

    [HttpPost("create_payment")]
    public async Task<IActionResult> CreatePayment([FromBody] PaymentRequest paymentRequest)
    {
        try
        {
            var payment = await _mercadoPagoService.CreatePaymentAsync(
                paymentRequest.Amount,
                paymentRequest.Description,
                paymentRequest.Token,
                paymentRequest.Email
            );

            return Ok(payment);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}

public class PaymentRequest
{
    public decimal Amount { get; set; }
    public string Description { get; set; }
    public string Token { get; set; }
    public string Email { get; set; }
}