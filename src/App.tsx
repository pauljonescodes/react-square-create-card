import { Card, Payments } from "@square/web-payments-sdk-types";
import { payments } from "@square/web-sdk";
import { useEffect, useState } from "react";

function App() {
  const [paymentsState, setPaymentsState] = useState<Payments | null>(null);
  const [cardState, setCardState] = useState<Card | null>(null);

  useEffect(() => {
    async function initializePayments() {
      let loadedPayments: Payments | null;
      if (!paymentsState) {
        try {
          loadedPayments = await payments(
            process.env.REACT_APP_SQUARE_APP_ID!,
            process.env.REACT_APP_SQUARE_LOCATION_ID!
          );
          if (loadedPayments != null) {
            setPaymentsState(loadedPayments);
          }
        } catch (error) {
          console.error(error);
        }
      }
    }
    initializePayments();
  }, [paymentsState]);

  useEffect(() => {
    let card: Card | undefined;
    if (paymentsState && !cardState) {
      try {
        (async () => {
          card = await paymentsState.card();
          await card.attach("#card-container");
          if (card != null) {
            setCardState(card);
          }
        })();
      } catch (error) {
        console.error(error);
      }
    }

    return () => {
      cardState?.detach();
    };
  }, [paymentsState, cardState]);

  return (
    <div className="App">
      <form id="payment-form">
        <div id="card-container"></div>
        <button
          id="card-button"
          type="button"
          onClick={async () => {
            const cardTokenizationResult = await cardState?.tokenize();
            if (
              cardTokenizationResult?.status !== "OK" ||
              cardTokenizationResult?.token == null
            ) {
              throw new Error(
                `Tokenization errors: ${JSON.stringify(
                  cardTokenizationResult?.errors
                )}`
              );
            }

            const verifyBuyerResponseDetails = await paymentsState?.verifyBuyer(
              cardTokenizationResult?.token,
              {
                billingContact: {
                  givenName: process.env.REACT_APP_BUYER_GIVEN_NAME,
                  familyName: process.env.REACT_APP_BUYER_FAMILY_NAME,
                  addressLines: [
                    process.env.REACT_APP_BUYER_ADDRESS_LINE_1!,
                    process.env.REACT_APP_BUYER_ADDRESS_LINE_2!,
                  ],
                  city: process.env.REACT_APP_BUYER_CITY,
                  state: process.env.REACT_APP_BUYER_STATE,
                  postalCode: process.env.REACT_APP_BUYER_POSTAL_CODE,
                  countryCode: process.env.REACT_APP_BUYER_COUNTRY_CODE,
                  email: process.env.REACT_APP_BUYER_EMAIL,
                  phone: process.env.REACT_APP_BUYER_PHONE,
                },
                intent: "STORE",
              }
            );

            // Do something with:
            console.log(cardTokenizationResult?.token); // "sourceId"
            console.log(verifyBuyerResponseDetails?.token);
          }}
        >
          Store Card
        </button>
      </form>
    </div>
  );
}

export default App;
