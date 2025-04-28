# Kumpi sähkö?

Easily find out which electricity contract, spot-priced or fixed, saves you more based on your real usage data.  
This app helps Finnish consumers make smarter energy decisions using Fingrid Datahub data.

## Kumpi sähkö?

[Kumpi sähkö?](https://kumpi-sahko.vercel.app/) calculates which Finnish electricity contract would have been (and likely will be) the cheapest option for you.  
The calculations are based on the user's uploaded consumption data, downloaded from [Fingrid Datahub](https://www.fingrid.fi/en/electricity-market/datahub/).  
Spot price data is fetched from the [ENTSO-E Transparency Platform](https://transparency.entsoe.eu/).

---

## Features

- Compare spot-priced and constant-priced electricity contracts
- Upload your real consumption data from Fingrid Datahub
- Instantly recalculate results with interactive sliders
- Visualize usage optimization with a deviation bar
- Get simple advice based on your consumption habits

---

## Using the App

<img src="https://github.com/user-attachments/assets/5c1f83db-ae72-45b0-81c8-74f8e64959e2" width="500" />

1. Select the constant price you want to compare to.
2. Optionally select a margin added to the spot price.
3. Upload your consumption data.

---

## Results

<img src="https://github.com/user-attachments/assets/250f74cb-6f71-4e0c-9d75-0683bbf55673" width="500" />

Once the data is uploaded:

- The app calculates the total electricity cost for both spot-priced and constant-priced contracts.
- Users can still adjust the price and margin sliders.
- Calculations happen instantly on the client side for a smooth user experience.
- A deviation bar shows your electricity consumption habits.
- A short comment is provided explaining how your consumption habits affect the results.
