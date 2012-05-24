I18n.defaultLocale = "en";
I18n.defaultSeparator = ".";

I18n.translations = {
  en: {
    app: { name: "Find Your Car" },
    search: { 
      heading: "Search",
      instructions: "Search for your vehicle by typing in your license plate below",
      placeholder: "Enter your License Plate",
      button: "Search",
      new: "New Search"
    },
    loading: { heading: "Loading&hellip;", text: "Searching for vehicles with license plate similar to "},
    results: { 
      heading: "Results",
      instructions: "Select your vehicle from the matches below",
      searchQuery: "You searched for",
      select: "This is my car",
      reject: "My vehicle is not in the results"
    },
    labels: {
      result: "Result",
      location: "Location",
      plate: "License Plate"      
    },
    map: {
      heading: "Map", info: "Your vehicle is parked on"
    },
    noResults: {
      heading: "Unfortunately, we could not locate your vehicle",
      text: "No match was found for the plate search that you enterered. This could be caused by one of the following problems:",
      reasons: { 
        notEnoughCharacters: "You did not enter enough characters of the license plate",
        plateNotVisible: "Your vehicle is parked in an area without camera sensors (such as a rooftop)",
        environmentalConditions: "An obstruction or bright lighting prevented a clear view of your license plate",
        algorithms: "Our plate recognition algorithms could not decode your license plate"
      },
      contactInfo: "For further assistance contact mall customer service"
    }
  },
  es: {
    app: { name: "Encuentra tu Auto" },
    search: { 
      heading: "Buscar",
      instructions: "Introduzca su patente debajo para buscar su vehículo ",
      placeholder: "Ingrese su patente",
      button: "Buscar",
      new: "Nueva Búsqueda"
    },
    loading: { heading: "Cargando&hellip;", text: "Buscando vehículos con patentes similares a "},
    results: { 
      heading: "Resultados",
      instructions: "Seleccione su vehículo",
      searchQuery: "Su búsqueda fue",
      select: "Este es mi vehículo",
      reject: "Mi vehículo no está entre los resultados"
     },
    labels: {
      result: "Resultado",
      location: "Ubicación",
      plate: "Patente"      
    },
    map: {
      heading: "Mapa", info: "Su vehículo se encuentra estacionado en "
    },
    noResults: {
      heading: "Lamentablemente no encontramos su vehículo",
      text: "No se han encontrados matrículas similares a la ingresada. Las causas posibles se reducen a:",
      reasons: { 
        notEnoughCharacters: "El número de carácteres ingresado es insuficiente",
        plateNotVisible: "Su vehículo esta fuera del alcance de nuestras cámaras (lugares abiertos)",
        environmentalConditions: "Condiciones ambientales impiden que los sensores obtengan una imagen clara de su matrícula.",
        algorithms: "Nuestros algoritmos no pudieron decodificar su matrícula"
      },
      contactInfo: "Por favor, agregue mas carácteres e intente nuevamente"
    }
  }
}
