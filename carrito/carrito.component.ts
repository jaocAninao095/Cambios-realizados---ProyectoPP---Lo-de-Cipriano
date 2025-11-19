import { Component, OnInit } from '@angular/core';
import { Producto } from '../../model/producto.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CarritoService } from '../../servicios/carrito.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-carrito',
  imports: [CommonModule, FormsModule],
  templateUrl: './carrito.component.html',
  styleUrl: './carrito.component.css'
})
export class CarritoComponent implements OnInit {
  productosEnCarrito: {producto: Producto; cantidad : number}[] = []

  constructor(private carritoService: CarritoService, private router : Router){}

  ngOnInit(): void {
    this.carritoService.carrito$.subscribe((productos) => {
      this.productosEnCarrito = productos;
    });
  }

  agregarCantidad(index: number){
    this.productosEnCarrito[index].cantidad++;
  }

  quitarCantidad(index: number){
    if(this.productosEnCarrito[index].cantidad>1){
      this.productosEnCarrito[index].cantidad--;
    }
  }

  eliminarProducto(productoId: number){
    this.carritoService.eliminarDelCarrito(productoId)
  }

  vaciarCarrito(){
    this.carritoService.vaciarCarrito()
  }

  realizarCompra(){            // ================ PARTE CAMBIADA PROBLEMA F6 ===================
    this.irAFormularioCompra()
    this.vaciarCarrito()
  }

  // navega al formulario de compra
  irAFormularioCompra(){
    //redirige al usuario a la ruta "/compra", donde se encuentra el formulario para realizar la compra
    this.router.navigate(["/compra"])
  }
  //calcular el total del cvarrito de compras
  calcularTotal(): number{
    // recorre el arreglo de productos en el carrito y suma el resultado de (precio * cantidad) de cada item
    return this.productosEnCarrito.reduce((total, item)=>{
      return total + item.producto.precio * item.cantidad
    },0) //el acumulador "total" comienza en 0
  }
}
