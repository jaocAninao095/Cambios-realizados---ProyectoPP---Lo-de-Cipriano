import { Component, OnInit } from '@angular/core';

import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import jsPDF from 'jspdf';
import { CarritoService } from '../../servicios/carrito.service';
import { Router } from '@angular/router'; //=====NECESARIO PARA RESOLVER F5======

@Component({
  selector: 'app-compra',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './compra.component.html',
  styleUrls: ['./compra.component.css']
})
export class CompraComponent implements OnInit {

formularioCompra!: FormGroup;

total!: number;

envio = 1500;

facturaGenerada = false;

factura: any;

mostrarModal = false;


pdfSrc: SafeResourceUrl | undefined;

constructor(
  private fb: FormBuilder,            
  private carritoService: CarritoService,  
  private sanitizer: DomSanitizer,   
  private router: Router               // Para redirijir al usuario al inicio tras la compra !=====NECESARIO PARA RESOLVER F5======!
) {}


ngOnInit(): void {
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

calcularTotal(): number {
  const subtotal = this.carritoService.obtenerTotal(); 
  this.total = subtotal + this.envio;                    
  return this.total;
}


emitirFactura(): void {
  const datosCliente = this.formularioCompra.value;          
  const productos = this.carritoService.obtenerProductos();  
  const totalFinal = this.calcularTotal();                  

  
  this.factura = {
    cliente: datosCliente,
    productos: productos,
    envio: this.envio,
    total: totalFinal,
    fecha: new Date()
  };

  
  this.facturaGenerada = true;
}


finalizarCompra(): void {
  if (this.formularioCompra.valid) {
    this.emitirFactura();       
    this.generarPDFModal();    
    
  } else {
    this.formularioCompra.markAllAsTouched(); 
  }
}

//ACA ESTA EL CAMBIO, ES TODO EL METODO ASIQUE COPIALO NOMAS//

  generarPDFModal(): void {
  if (!this.factura) return;

  const doc = new jsPDF();

  // --- 1. Encabezado de la Factura ---
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURA DE COMPRA', 105, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('No. Factura: #12345678', 196, 26, { align: 'right' }); 
  doc.text(`Fecha: ${this.factura.fecha.toLocaleDateString()}`, 196, 32, { align: 'right' });
  doc.line(10, 36, 200, 36);


  // --- 2. Información del Cliente ---
  let y = 45;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Datos del Cliente', 14, y);

  y += 5;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const c = this.factura.cliente;
  doc.text(`Nombre: ${c.nombre}`, 14, y += 6);
  doc.text(`Correo: ${c.correo}`, 14, y += 6);
  doc.text(`Teléfono: ${c.telefono}`, 14, y += 6);
  doc.text(`Dirección: ${c.direccion}, ${c.ciudad}, ${c.provincia} (${c.codigoPostal})`, 14, y += 6);

  y += 8;
  doc.line(10, y, 200, y);

  // --- 3. Listado de Productos (Estructura de Tabla con fondo) ---
  y += 8;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Detalle de Productos', 14, y);

  y += 8;

  // Encabezados de la Tabla
  const startY = y;
  doc.setFontSize(10);
  doc.setFillColor(230, 230, 230); 
  doc.rect(14, startY, 182, 7, 'F'); 
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Producto', 16, startY + 5);
  doc.text('Cant.', 120, startY + 5, { align: 'right' });
  doc.text('Precio Unitario', 150, startY + 5, { align: 'right' });
  doc.text('Subtotal', 196, startY + 5, { align: 'right' });

  // Filas de Productos
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  let totalItems = 0;

  this.factura.productos.forEach((item: any) => {

    if (totalItems % 2 !== 0) {
      doc.setFillColor(245, 245, 245);
      doc.rect(14, y, 182, 6, 'F');
    }

    doc.text(item.producto.nombre, 16, y + 4);
    doc.text(`${item.cantidad}`, 120, y + 4, { align: 'right' });
    doc.text(`$${item.producto.precio.toFixed(2)}`, 150, y + 4, { align: 'right' });
    doc.text(`$${(item.producto.precio * item.cantidad).toFixed(2)}`, 196, y + 4, { align: 'right' });
    y += 6;
    totalItems++;
  });

  doc.line(14, y, 196, y); // Línea final de la tabla


  // --- 4. Totales ---
  y += 5;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  // Costo de Envío (Alineado a la derecha)
  doc.text('Costo de Envío:', 160, y, { align: 'right' });
  doc.text(`$${this.factura.envio.toFixed(2)}`, 196, y, { align: 'right' });
  

  // Línea de separación antes del total
  y += 5;
  doc.line(140, y, 196, y);
  y += 3;


  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');

  // Total a Pagar
  doc.text('TOTAL A PAGAR:', 160, y + 2, { align: 'right' });
  doc.text(`$${this.factura.total.toFixed(2)}`, 196, y + 2, { align: 'right' });

  // Línea doble para resaltar el total
  doc.setLineWidth(0.5);
  doc.line(138, y + 4, 196, y + 4);
  doc.setLineWidth(0.2); 

  
  // VACIAR EL CARRITO *después* de generar la factura
  this.carritoService.vaciarCarrito();

  // --- Finalización (Crear URL del PDF) ---
  const pdfBlob = doc.output('blob');
  this.pdfSrc = this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(pdfBlob));

  // Abre el modal que tiene el pdf
  this.mostrarModal = true;
}


cerrarModal(): void {
  this.mostrarModal = false;
  if (this.pdfSrc) {
 
    URL.revokeObjectURL((this.pdfSrc as any).changingThisBreaksApplicationSecurity);
    this.pdfSrc = undefined;
  }
}


imprimirPDF(): void {
  const iframe: HTMLIFrameElement | null = document.getElementById('pdfFrame') as HTMLIFrameElement;

  if (iframe && iframe.contentWindow) {

    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  }

}

volverAlInicio(){    //========================= CAMBIO POR PROBLEMA F5 ============================
  this.cerrarModal(); 
  this.router.navigate(["inicio"]);
}


}