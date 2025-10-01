# ControlFinanzasFrontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.3.

## Panel para el control de las finanzas del hogar

La pÃ¡gina principal ofrece un tablero listo para registrar ingresos y gastos domÃ©sticos. EncontrarÃ¡s:

- Un resumen del balance actual, totales de ingresos/gastos y tu porcentaje de ahorro estimado.
- Un formulario para capturar nuevos movimientos con fecha, categorÃ­a y notas.
- Un listado de movimientos recientes con opciÃ³n para eliminar registros.
- Indicadores automÃ¡ticos que resaltan el mes con mayor ingreso y la categorÃ­a con mÃ¡s gasto.
- Reportes rÃ¡pidos por mes y por categorÃ­a de gasto para detectar patrones de consumo.

Esta base puede ampliarse con autenticaciÃ³n, persistencia en una API o mÃ¡s visualizaciones segÃºn tus necesidades.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Subir el proyecto a tu repositorio de GitHub

Si deseas compartir este cÃ³digo en tu propia cuenta de GitHub, sigue estos pasos desde la carpeta del proyecto:

1. Inicia sesiÃ³n en GitHub y crea un repositorio vacÃ­o (sin README ni archivos iniciales).
2. En la terminal, agrega el remoto que apunta a tu nuevo repositorio:

   ```bash
   git remote add origin https://github.com/<tu-usuario>/<tu-repo>.git
   ```

3. Sube la rama principal (o la rama en la que estÃ©s trabajando):

   ```bash
   git push -u origin work
   ```

   Si prefieres usar `main` como nombre de la rama principal, puedes renombrarla antes de hacer push:

   ```bash
   git branch -M main
   git push -u origin main
   ```

Con esto, el repositorio quedarÃ¡ disponible en GitHub para clonarlo desde cualquier mÃ¡quina.
