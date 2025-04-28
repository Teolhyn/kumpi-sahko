## Kumpi sähkö?
[Kumpi sähkö?](https://kumpi-sahko.vercel.app/) app calculates which Finnish electricity contract would've been (and likely would be) the cheapest option for you. The calculations are based on the users uploaded consumption data that can be downloaded from [Fingrid Datahub](https://www.fingrid.fi/en/electricity-market/datahub/). The spot price data is fetched from [ENTSOe Transparency Platform](https://transparency.entsoe.eu/).

### Using the app
<img src="https://github.com/user-attachments/assets/5c1f83db-ae72-45b0-81c8-74f8e64959e2" width="300" />

1. Users can easily select the constant price they want to compare to.
2. Users can also select the margin added to the spot price.
3. Consumption data is uploaded.
   
### Results
<img src="https://github.com/user-attachments/assets/250f74cb-6f71-4e0c-9d75-0683bbf55673" width="300" />

Here we can see the total price calculated for a given consumption data for both spot priced and constant priced contracts. At this point user can still adjust the sliders and the results are calculated on the client side so they are practically refreshed in an instant. In addition to the cost, usage optimization is showed as deviation bar. There's also a short comment on the usage and how changes in consumption can effect the results.
