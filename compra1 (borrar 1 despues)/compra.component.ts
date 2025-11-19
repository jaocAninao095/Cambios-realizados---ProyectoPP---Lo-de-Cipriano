import { Component, OnInit } from '@angular/core';

import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import jsPDF from 'jspdf';
import { CarritoService } from '../../servicios/carrito.service';
import { Router, RouterLink } from '@angular/router'; //=====NECESARIO PARA RESOLVER F5======

@Component({
  selector: 'app-compra',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './compra.component.html',
  styleUrls: ['./compra.component.css']
})
export class CompraComponent implements OnInit {
 // Declaración del formulario reactivo para la compra
formularioCompra!: FormGroup;

// Variable para almacenar el total de la compra (subtotal + envío)
total!: number;

// Costo fijo de envío
envio = 1500;

// indicador para saber si la factura ya fue generada
facturaGenerada = false;

// Objeto que contiene la información de la factura generada
factura: any;

// Controla la visibilidad del modal que muestra el PDF
mostrarModal = false;

// Fuente segura para mostrar el PDF generado en el iframe (URL sanitizada)
pdfSrc: SafeResourceUrl | undefined;

constructor(
  private fb: FormBuilder,            // FormBuilder para crear el formulario reactivo
  private carritoService: CarritoService,  // Servicio para manejar el carrito y obtener productos y total
  private sanitizer: DomSanitizer,    // Para sanitizar la URL del PDF y que Angular lo permita mostrar
  private router: Router               // Para redirijir al usuario al inicio tras la compra !=====NECESARIO PARA RESOLVER F5======!
) {}

// Método que se ejecuta al inicializar el componente
ngOnInit(): void {
  //formulario con los campos requeridos y validadores
  this.formularioCompra = this.fb.group({
    nombre: ['', Validators.required],
    direccion: ['', Validators.required],
    correo: ['', [Validators.required, Validators.email]],
    telefono: ['', Validators.required],
    codigoPostal: ['', Validators.required],
    ciudad: ['', Validators.required],
    provincia: ['', Validators.required],
    metodoPago: ['', Validators.required]
  });
}

// Calcula el total de la compra sumando el subtotal y el costo de envío
calcularTotal(): number {
  const subtotal = this.carritoService.obtenerTotal();  // Obtiene subtotal del carrito
  this.total = subtotal + this.envio;                    // Suma envío al subtotal
  return this.total;
}

// Prepara los datos para la factura con cliente, productos, totales y fecha
emitirFactura(): void {
  const datosCliente = this.formularioCompra.value;          // Datos ingresados en el formulario
  const productos = this.carritoService.obtenerProductos();  // Productos del carrito
  const totalFinal = this.calcularTotal();                   // Total calculado con envío

  // Construye el objeto factura con toda la info necesaria
  this.factura = {
    cliente: datosCliente,
    productos: productos,
    envio: this.envio,
    total: totalFinal,
    fecha: new Date()
  };

  // Marca que la factura fue generada
  this.facturaGenerada = true;
}

// Método que se ejecuta al finalizar la compra (clic en botón)
// Verifica validez del formulario, genera factura y muestra PDF
finalizarCompra(): void {
  if (this.formularioCompra.valid) {
    this.emitirFactura();       // Crea la factura
    this.generarPDFModal();     // Genera y muestra el PDF en modal
    
  } else {
    this.formularioCompra.markAllAsTouched(); // Marca todos los campos como tocados para mostrar errores
  }
}

// Genera el PDF con jsPDF y crea la URL para mostrar en iframe dentro del modal
generarPDFModal(): void {  // =========== POSIBLE PDF PARA FACTURA, PERO EL DE JOAQUIN URIBE ESTA MEJOR ===============
  if (!this.factura) return;

  const doc = new jsPDF();

  // ====== TÍTULO ======
  doc.setFontSize(20);
  doc.text('Factura de Compra', 14, 20);
  doc.setLineWidth(0.5);
  doc.line(10, 25, 200, 25); // línea decorativa

  // ====== FECHA ======
  doc.setFontSize(12);
  doc.text(`Fecha: ${this.factura.fecha.toLocaleString()}`, 14, 35);

  // ====== INFO CLIENTE (dentro de un recuadro) ======
  doc.setFontSize(14);
  doc.text('Datos del Cliente', 14, 45);
  doc.setLineWidth(0.2);
  doc.rect(10, 48, 190, 58); // recuadro

  const c = this.factura.cliente;
  let y = 58;

  doc.setFontSize(12);
  doc.text(`Nombre: ${c.nombre}`, 14, y);
  y += 8;
  doc.text(`Dirección: ${c.direccion}`, 14, y);
  y += 8;
  doc.text(`Correo: ${c.correo}`, 14, y);
  y += 8;
  doc.text(`Teléfono: ${c.telefono}`, 14, y);
  y += 8;
  doc.text(`Ciudad: ${c.ciudad}`, 14, y);
  y += 8;
  doc.text(`Provincia: ${c.provincia}`, 14, y);
  y += 8;
  doc.text(`Código Postal: ${c.codigoPostal}`, 14, y);

  // ====== TABLA DE PRODUCTOS ======
  y += 20;
  doc.setFontSize(14);
  doc.text('Productos', 14, y);
  doc.line(10, y + 2, 200, y + 2);

  y += 10;

  // Encabezados
  doc.setFontSize(12);
  doc.text('Producto', 20, y);
  doc.text('Cant.', 120, y);
  doc.text('Precio', 150, y);
  doc.text('Subtotal', 180, y);

  doc.line(10, y + 2, 200, y + 2);

  // Contenido
  y += 10;

  this.factura.productos.forEach((item: any) => {
    doc.text(item.producto.nombre, 20, y);
    doc.text(String(item.cantidad), 120, y);
    doc.text(`$${item.producto.precio.toFixed(2)}`, 150, y);
    doc.text(
      `$${(item.producto.precio * item.cantidad).toFixed(2)}`,
      180,
      y
    );
    y += 10;


    this.carritoService.vaciarCarrito() // ================== NECESARIO PARA VACIAR CARRITO TRAS LA COMPRA F6==========================
  });

  // ====== TOTAL ======
  y += 10;
  doc.line(10, y, 200, y);
  y += 10;

  doc.setFontSize(12);
  doc.text(`Costo de Envío: $${this.factura.envio.toFixed(2)}`, 14, y);
  y += 10;

  doc.setFontSize(16);
  doc.text(`Total a Pagar: $${this.factura.total.toFixed(2)}`, 14, y);

  // ====== FINAL ======
  const pdfBlob = doc.output('blob');
  this.pdfSrc = this.sanitizer.bypassSecurityTrustResourceUrl(
    URL.createObjectURL(pdfBlob)
  );
  this.mostrarModal = true;
}


// Método para cerrar el modal y liberar la URL del PDF para evitar fugas de memoria
cerrarModal(): void {
  this.mostrarModal = false;
  if (this.pdfSrc) {
    // Se revoca la URL para liberar recursos
    URL.revokeObjectURL((this.pdfSrc as any).changingThisBreaksApplicationSecurity);
    this.pdfSrc = undefined;
  }
}

// Método para imprimir el PDF que está cargado dentro del iframe en la vista
imprimirPDF(): void {
  // Obtiene la referencia al elemento iframe del DOM mediante su ID 'pdfFrame'
  // Puede devolver null si no se encuentra el elemento
  const iframe: HTMLIFrameElement | null = document.getElementById('pdfFrame') as HTMLIFrameElement;

  // Verifica que el iframe exista y que tenga un objeto contentWindow válido
  if (iframe && iframe.contentWindow) {
    // Le da foco al contenido del iframe para asegurarse que la ventana correcta está activa para imprimir
    iframe.contentWindow.focus();

    // Llama al método print() de la ventana del iframe para abrir la ventana de impresión del navegador
    iframe.contentWindow.print();
  }
}

volverAlInicio(){    //========================= CAMBIO POR PROBLEMA F5 ============================
  this.cerrarModal(); 
  this.router.navigate(["inicio"]);
}


}