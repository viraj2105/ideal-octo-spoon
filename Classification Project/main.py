from fastapi import FastAPI
import pandas as pd
import joblib
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel,Field
app=FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# pydantic model--->>> check for input validation
columns = [
    'latitude',
    'longitude',
    'price',
    'minimum_nights',
    'number_of_reviews',  # Add this
    'reviews_per_month',
    'calculated_host_listings_count',
    'availability_365',
    'neighbourhood_group',
    'neighbourhood'
]
from pathlib import Path
# import joblib

model_path = Path(__file__).resolve().parent / "Model_pipeline.pkl"
model = joblib.load(model_path)
class Features(BaseModel):
    latitude: float = Field( ... , ge =- 90, le=90, description="Latitude coordinate")
    longitude: float = Field( ... , ge =- 180, le=180, description="Longitude coordinate")
    price: float = Field( ... , gt=0, description="Price per night, must be positive")
    minimum_nights: int = Field( ... , ge=1, le=365, description="Minimum nights required for booking")
    number_of_reviews: int = Field( ... , ge=0, description="Total number of reviews")
    reviews_per_month: float = Field( ... , ge=0, description="Average reviews per month")
    calculated_host_listings_count: int = Field( ... , ge=0, description="Number of listings by this host" )
    availability_365: int = Field( ... , ge=0, le=365, description="Days available out of 365")
    neighbourhood_group: str = Field( ... , min_length=1, description="Borough or neighbourhood group")
    neighbourhood: str = Field( ... , min_length=1, description="Specific neighbourhood name")








@app.get('/')
def greet():
    return "Jay Shree Ram"

@app.post('/predict')
def predict(features: Features):
    row = pd.DataFrame([features.model_dump()], columns=columns)
    prediction=model.predict(row)[0]
    probability=model.predict_proba(row)
    return {"prediction": prediction, "probability": probability[0].tolist()}