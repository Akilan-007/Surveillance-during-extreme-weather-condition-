package com.example.weather.surveillance.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.weather.surveillance.dto.ForecastResponse;
import com.example.weather.surveillance.dto.OpenWeatherResponse;
import com.example.weather.surveillance.service.WeatherService;



@RestController
public class hellocontroller {

    private final WeatherService weatherService;

    public hellocontroller(WeatherService weatherService) {
        this.weatherService = weatherService;
    }

    @GetMapping("/weather")
    public OpenWeatherResponse getWeather(@RequestParam String city) {
        return weatherService.getWeather(city);
    }
    @GetMapping("/forecast")
    public ForecastResponse getForecast(@RequestParam String city) {
        return weatherService.getForecast(city);
    }
    @GetMapping("/weather/location")
    public OpenWeatherResponse getWeatherByLocation(
            @RequestParam double lat,
            @RequestParam double lon) {

        return weatherService.getWeatherByLocation(lat, lon);
    }
    @GetMapping("/analytics")
public Map<String, Object> getAnalytics() {

    List<String> cities = List.of("Madurai","Chennai","Delhi","Mumbai");

    double avgTemp = 0;
    double maxTemp = -100;
    double minTemp = 100;

    for(String city : cities){

        OpenWeatherResponse w = weatherService.getWeather(city);

        avgTemp += w.getMain().getTemp();

        maxTemp = Math.max(maxTemp,w.getMain().getTemp());
        minTemp = Math.min(minTemp,w.getMain().getTemp());
    }

    avgTemp /= cities.size();

    Map<String,Object> map = new HashMap<>();

    map.put("averageTemperature",avgTemp);
    map.put("maximumTemperature",maxTemp);
    map.put("minimumTemperature",minTemp);

    return map;
}
    }

