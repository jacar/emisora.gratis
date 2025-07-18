package com.topradio.webview // Asegúrate que el paquete coincida

import android.graphics.Bitmap
import android.os.Bundle
import android.util.Log
import android.view.View
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast // Para mensajes de error
import androidx.appcompat.app.AppCompatActivity
import com.topradio.webview.databinding.ActivityMainBinding // Importa la clase de ViewBinding generada

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private val targetUrl = "https://emisorasgratis.com" // URL a cargar

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Inflar el layout usando ViewBinding
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupWebView()
        binding.webview.loadUrl(targetUrl)
    }

    private fun setupWebView() {
        // Configurar el WebViewClient para manejar la carga de páginas y errores
        binding.webview.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                // Opcional: Mostrar un indicador de progreso (ProgressBar)
                // Si tienes un ProgressBar en tu layout con id "progressBar", puedes hacer:
                // binding.progressBar?.visibility = View.VISIBLE
                Log.d("WebViewSetup", "Page loading started: $url")
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                // Opcional: Ocultar el indicador de progreso
                // binding.progressBar?.visibility = View.GONE
                Log.d("WebViewSetup", "Page loading finished: $url")
            }

            override fun onReceivedError(
                    view: WebView?,
                    request: WebResourceRequest?,
                    error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                // Manejar solo errores del frame principal para no mostrar errores por sub-recursos
                if (request?.isForMainFrame == true) {
                    // Opcional: Ocultar el indicador de progreso
                    // binding.progressBar?.visibility = View.GONE
                    val errorMessage = "Error al cargar página: ${error?.description} (Código: ${error?.errorCode})"
                    Log.e("WebViewSetup", errorMessage)
                    Toast.makeText(applicationContext, errorMessage, Toast.LENGTH_LONG).show()
                    // Aquí podrías cargar una página de error local, por ejemplo:
                    // view?.loadUrl("file:///android_asset/error.html")
                }
            }
        }

        // Obtener y configurar WebSettings
        val webSettings: WebSettings = binding.webview.settings

        // Habilitaciones esenciales
        webSettings.javaScriptEnabled = true      // Necesario para la mayoría de las webs modernas
        webSettings.domStorageEnabled = true      // Permite a las webs almacenar datos localmente (localStorage, sessionStorage)

        // Mejoras de UX y compatibilidad
        webSettings.useWideViewPort = true        // Permite que el viewport sea más grande que el WebView
        webSettings.loadWithOverviewMode = true   // Carga la página completamente alejada para que quepa
        webSettings.setSupportZoom(true)          // Habilitar zoom
        webSettings.builtInZoomControls = true    // Mostrar controles de zoom integrados
        webSettings.displayZoomControls = false   // Ocultar los controles de zoom en pantalla (mejor UX)

        // Caché (usar la configuración por defecto suele ser una buena opción)
        webSettings.cacheMode = WebSettings.LOAD_DEFAULT

        // Seguridad: Estas son configuraciones importantes
        // Deshabilitar el acceso a archivos del sistema si solo cargas URLs remotas.
        // Esto es más seguro.
        webSettings.allowFileAccess = false
        // Permitir acceso a proveedores de contenido (generalmente necesario y seguro).
        webSettings.allowContentAccess = true

        // Opcional: Otras configuraciones que podrían ser útiles
        // webSettings.databaseEnabled = true // Si la web usa Web SQL Database (aunque está obsoleto)
        // webSettings.mediaPlaybackRequiresUserGesture = false // Descomentar con precaución, permitiría autoplay de video
    }

    override fun onBackPressed() {
        // Si el WebView puede ir hacia atrás en su historial, lo hace
        if (binding.webview.canGoBack()) {
            binding.webview.goBack()
        } else {
            // De lo contrario, se ejecuta el comportamiento por defecto del botón "Atrás"
            super.onBackPressed()
        }
    }

    override fun onDestroy() {
        // Es una buena práctica limpiar los recursos del WebView para evitar fugas de memoria,
        // especialmente si la actividad se destruye y recrea con frecuencia.
        binding.webview.apply {
            stopLoading()       // Detener cualquier carga en curso
            clearHistory()      // Limpiar el historial de navegación
            clearCache(true)    // Limpiar la caché (el parámetro 'true' incluye archivos de disco)
            clearFormData()     // Limpiar datos de formularios
            onPause()           // Pausar el estado interno del WebView
            removeAllViews()    // Eliminar vistas hijas si las hubiera
            // La llamada a destroy() es crucial para liberar memoria nativa.
        }
        // Llamar a destroy() después de haber desvinculado el WebView del árbol de vistas
        // y haber limpiado sus estados. Android Studio a veces sugiere llamarlo
        // en un post o después de que la ventana se desvincule.
        // Pero para la mayoría de los casos, aquí en onDestroy es adecuado.
        binding.webview.destroy()
        super.onDestroy()
    }
}
