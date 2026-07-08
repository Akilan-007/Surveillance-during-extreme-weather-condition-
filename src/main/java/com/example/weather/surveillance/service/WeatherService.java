package com.example.weather.surveillance.service;

import com.example.weather.surveillance.dto.OpenWeatherResponse;
import com.example.weather.surveillance.entity.Weather;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.beans.factory.annotation.Value;
import com.example.weather.surveillance.dto.ForecastResponse;

@Service
public class WeatherService {
    @Value("${weather.api.key}")
    private String apiKey;

    public OpenWeatherResponse getWeather(String city){

        String apiKey = "67185ebe12d3f34654732ecad0562236";

        String url = "https://api.openweathermap.org/data/2.5/weather?q="
                + city
                + "&appid="
                + apiKey
                + "&units=metric";

        RestTemplate restTemplate = new RestTemplate();

        OpenWeatherResponse response =
                restTemplate.getForObject(url, OpenWeatherResponse.class);
        return response;


    }
    public ForecastResponse getForecast(String city) {

        String url = "https://api.openweathermap.org/data/2.5/forecast?q="
                + city
                + "&appid="
                + apiKey
                + "&units=metric"
                + "&cnt=40";

        RestTemplate restTemplate = new RestTemplate();

        return restTemplate.getForObject(url, ForecastResponse.class);
    }
    public OpenWeatherResponse getWeatherByLocation(double lat, double lon) {

        String url = "https://api.openweathermap.org/data/2.5/weather?lat="
                + lat
                + "&lon="
                + lon
                + "&appid="
                + apiKey
                + "&units=metric";

        RestTemplate restTemplate = new RestTemplate();

        return restTemplate.getForObject(url, OpenWeatherResponse.class);
    }
}