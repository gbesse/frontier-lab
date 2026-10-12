# GARAN Witness

## Français

Alpha de vérification **indépendante du CMS** du rendu d’un parcours d’achat. `probe` ouvre les URL fournies dans Chromium, sans cliquer ni acheter, relève la langue de la page et la visibilité des sélecteurs de notice et de label GARAN, puis compare le texte attendu. `audit` analyse des observations déjà collectées ; `demo` utilise uniquement des données fictives.

```sh
garan-witness demo --locale=fr
garan-witness audit observations.json --locale=fr
garan-witness probe pages.json rapport.json --locale=fr
```

Fournir une URL **déjà prête à consulter** pour chaque étape (produit, panier, paiement), des sélecteurs CSS et la langue attendue. N’utiliser `probe` que sur des sites autorisés ; les pages visitées peuvent journaliser une consultation. Aucun achat ni formulaire n’est soumis. L’outil ne reconnaît pas les graphismes officiels, ne vérifie pas les conditions d’éligibilité au label, ne mesure pas l’accessibilité et **ne certifie pas la conformité juridique**. Faire contrôler le rendu par une personne compétente. [Règlement d’exécution (UE) 2025/1960](https://eur-lex.europa.eu/eli/reg_impl/2025/1960/oj).

## English

A **CMS-independent** alpha for checking the rendered purchase journey. `probe` opens supplied URLs in Chromium without clicking or buying, records page language and visibility of notice and GARAN-label selectors, then compares expected text. `audit` evaluates previously collected observations; `demo` uses fictional data only.

```sh
garan-witness demo --locale=en
garan-witness audit observations.json --locale=en
garan-witness probe pages.json report.json --locale=en
```

Supply a URL **ready to view** for each step (product, cart, checkout), CSS selectors and expected language. Run `probe` only on authorized sites; visited pages may log a view. No purchase or form is submitted. The tool does not authenticate official artwork, determine label eligibility, measure accessibility or **certify legal compliance**. Have a qualified person review the rendering. [Commission Implementing Regulation (EU) 2025/1960](https://eur-lex.europa.eu/eli/reg_impl/2025/1960/oj).

## Español

Alfa **independiente del CMS** para comprobar el recorrido de compra mostrado. `probe` abre las URL aportadas en Chromium sin hacer clic ni comprar, registra el idioma y la visibilidad de los selectores del aviso y la etiqueta GARAN, y compara el texto esperado. `audit` evalúa observaciones ya recogidas; `demo` solo usa datos ficticios.

```sh
garan-witness demo --locale=es
garan-witness audit observaciones.json --locale=es
garan-witness probe paginas.json informe.json --locale=es
```

Proporciona una URL **lista para consultar** por etapa (producto, cesta, pago), selectores CSS e idioma esperado. Usa `probe` solo en sitios autorizados; las páginas visitadas pueden registrar la visita. No se envía ningún formulario ni se realiza una compra. La herramienta no autentica el diseño oficial, no determina la elegibilidad de la etiqueta, no mide la accesibilidad ni **certifica el cumplimiento jurídico**. Pide a una persona competente que revise el resultado. [Reglamento de Ejecución (UE) 2025/1960](https://eur-lex.europa.eu/eli/reg_impl/2025/1960/oj).

MIT — [LICENSE](LICENSE).
