﻿
let ValorImpuesto = 0;
$(document).ready(function () {


    fetch("/Venta/ListaTipoDocumentoVenta")
        .then(response => {
            return response.ok ? response.json() : Promise.reject(response);
        })
        .then(responseJson => {
            if (responseJson.length > 0) {
                responseJson.forEach((item) => {
                    $("#cboTipoDocumentoVenta").append(
                        $("<option>").val(item.idTipoDocumentoVenta).text(item.descripcion)
                    )
                })
            }
        })



    fetch("/Negocio/Obtener")
        .then(response => {
            return response.ok ? response.json() : Promise.reject(response);
        })
        .then(responseJson => {

            if (responseJson.estado) {

                const d = responseJson.objeto;


                $("#inputGroupSubTotal").text(`Sub total - ${d.simboloMoneda}`)
                $("#inputGroupIGV").text(`IGV(${d.porcentajeImpuesto}%) - ${d.simboloMoneda}`)
                $("#inputGroupTotal").text(`Total - ${d.simboloMoneda}`)

                ValorImpuesto = parseFloat(d.porcentajeImpuesto)
            }

        })

    $("#cboBuscarProducto").select2({
        ajax: {
            url: "/Venta/ObtenerProductos",
            dataType: 'json',
            contentType: "application/json; charset=utf-8",
            delay: 250,
            data: function (params) {
                return {
                    busqueda: params.term
                };
            },
            processResults: function (data,) {

                return {
                    results: data.map((item) => (
                        {
                            id: item.idProducto,
                            text: item.descripcion,

                            marca: item.marca,
                            categoria : item.nombreCategoria,
                            urlImagen: item.urlImagen,
                            precio : parseFloat(item.precio)
                        }
                    ))
                };
            }
        },
        language: "es",
        placeholder: 'Buscar Producto...',
        minimumInputLength: 1,
        templateResult: formatoResultados
    });



})

function formatoResultados(data) {

    //esto es por defecto, ya que muestra el "buscando..."
    if (data.loading)
        return data.text;

    var contenedor = $(
        `<table width="100%">
            <tr>
                <td style="width:60px">
                    <img style="height:60px;width:60px;margin-right:10px" src="${data.urlImagen}"/>
                </td>
                <td>
                    <p style="font-weight: bolder;margin:2px">${data.marca}</p>
                    <p style="margin:2px">${data.text}</p>
                </td>
            </tr>
         </table>`
    );

    return contenedor;
}

$(document).on("select2:open", function () {
    document.querySelector(".select2-search__field").focus();
})

let ProductosParaVenta = [];
$("#cboBuscarProducto").on("select2:select", function (e) {
    const data = e.params.data;

    let producto_encontrado = ProductosParaVenta.filter(p => p.idProducto == data.id)
    if (producto_encontrado.length > 0) {
        $("#cboBuscarProducto").val("").trigger("change")
        toastr.warning("", "El producto ya fue agregado")
        return false
    }

    swal({
        title: data.marca,
        text: data.text,
        imageUrl: data.urlImagen,
        type:"input",
        showCancelButton: true,
        closeOnConfirm: false,
        inputPlaceholder: "Ingrese Cantidad"
    },
        function (valor) {

            if (valor === false) return false;

            if (valor === "") {
                toastr.warning("", "Necesita ingresar la cantidad")
                return false;
            }
            if (isNaN(parseInt(valor))) {
                toastr.warning("", "Debe ingresar un valor númerico")
                return false;
            }

            let producto = {
                idProducto: data.id,
                marcaProducto: data.marca,
                descripcionProducto: data.text,
                categoriaProducto: data.categoria,
                cantidad: parseInt(valor),
                precio: data.precio.toString(),
                total: (parseFloat(valor) * data.precio).toString()

            }

            ProductosParaVenta.push(producto)

            mostrarProducto_Precios();
            $("#cboBuscarProducto").val("").trigger("change")
            swal.close()
        }
    )

})

function mostrarProducto_Precios() {

    let total = 0;
    let igv = 0;
    let subtotal = 0;
    let porcentaje = ValorImpuesto / 100;

    $("#tbProducto tbody").html("")

    ProductosParaVenta.forEach((item) => {

        total = total + parseFloat(item.total)

        $("#tbProducto tbody").append(
            $("<tr>").append(
                $("<td>").append(
                    $("<button>").addClass("btn btn-danger btn-eliminar btn-sm").append(
                        $("<i>").addClass("fas fa-trash-alt")
                    ).data("idProducto",item.idProducto)
                ),
                $("<td>").text(item.descripcionProducto),
                $("<td>").text(item.cantidad),
                $("<td>").text(item.precio),
                $("<td>").text(item.total)
            )
        )
    })

    subtotal = total / (1 + porcentaje);
    igv = total - subtotal;

    $("#txtSubTotal").val(subtotal.toFixed(2))
    $("#txtIGV").val(igv.toFixed(2))
    $("#txtTotal").val(total.toFixed(2))


}

$(document).on("click", "button.btn-eliminar", function () {

    const _idproducto = $(this).data("idProducto")

    ProductosParaVenta = ProductosParaVenta.filter(p => p.idProducto != _idproducto);

    mostrarProducto_Precios();
})


$("#btnTerminarVenta").click(function () {

    const documentoCliente = $("#txtDocumentoCliente").val().trim();
    const nombreCliente = $("#txtNombreCliente").val().trim();

    if (documentoCliente === "") {
        toastr.warning("", "El número de documento es obligatorio.");
        return; // Salir si el campo está vacío
    }

    if (nombreCliente === "") {
        toastr.warning("", "El nombre completo es obligatorio.");
        return; // Salir si el campo está vacío
    }

    if (ProductosParaVenta.length < 1) {
        toastr.warning("", "Debe ingresar productos");
        return; // Salir si no hay productos
    }

    const vmDetalleVenta = ProductosParaVenta;

    const venta = {
        idTipoDocumentoVenta: $("#cboTipoDocumentoVenta").val(),
        documentoCliente: $("#txtDocumentoCliente").val(),
        nombreCliente: $("#txtNombreCliente").val(),
        subTotal: $("#txtSubTotal").val(),
        impuestoTotal: $("#txtIGV").val(),
        total: $("#txtTotal").val(),
        DetalleVenta : vmDetalleVenta
    }

    $("#btnTerminarVenta").LoadingOverlay("show");

    fetch("/Venta/RegistrarVenta", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(venta)
    })
        .then(response => {
            $("#btnTerminarVenta").LoadingOverlay("hide");
            return response.ok ? response.json() : Promise.reject(response);
        })
        .then(responseJson => {

            if (responseJson.estado) {
                ProductosParaVenta = [];
                mostrarProducto_Precios();

                $("#txtDocumentoCliente").val("")
                $("#txtNombreCliente").val("")
                $("#cboTipoDocumentoVenta").val($("#cboTipoDocumentoVenta option:first").val())

                swal("Registrado!", `Numero Venta : ${responseJson.objeto.numeroVenta}`, "success")
            } else {
                swal("Lo sentimos!", "No se pudo registrar la venta", "error")
            }
        })

})


    // Inicializar Mercado Pago
// Inicializa el SDK de Mercado Pago
const mp = new MercadoPago('APP_USR-c8b4a37d-ae62-46a6-b936-bb90e0377fdf', {
    locale: 'es-AR' // Cambia según tu localización
});

document.getElementById("checkout-btn").addEventListener("click", async function () {
    const amount = document.getElementById("amount").value;
    const description = document.getElementById("description").value;
    const email = document.getElementById("email").value;
    const cardNumber = document.getElementById("cardNumber").value;
    const expirationMonth = document.getElementById("expirationMonth").value;
    const expirationYear = document.getElementById("expirationYear").value;
    const securityCode = document.getElementById("securityCode").value;

    // Crear el token de la tarjeta
    const cardData = {
        cardNumber: cardNumber,
        cardExpirationMonth: expirationMonth,
        cardExpirationYear: expirationYear,
        securityCode: securityCode,
        cardholderName: "Nombre del Titular", // Cambia según tu lógica
        identification: {
            type: "DNI", // Cambia según tu lógica
            number: "12345678" // Cambia según tu lógica
        }
    };

    try {
        const tokenResponse = await mp.createToken(cardData);
        const token = tokenResponse.id;

        // Enviar el pago al backend
        const paymentData = {
            amount: parseFloat(amount),
            description: description,
            token: token,
            email: email
        };

        const response = await fetch("http://localhost:5000/api/payment/create_payment", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(paymentData),
        });

        if (!response.ok) {
            throw new Error("Error en la creación del pago");
        }

        const paymentResponse = await response.json();
        console.log("Pago realizado con éxito:", paymentResponse);
        alert("Pago realizado con éxito!");

    } catch (error) {
        alert("Error al procesar el pago: " + error.message);
    }
});