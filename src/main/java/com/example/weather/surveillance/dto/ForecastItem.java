package com.example.weather.surveillance.dto;

import java.util.List;

public class ForecastItem {

    private MainWeather main;
    private Wind wind;
    private List<WeatherInfo> weather;
    private clouds clouds;
    private String dt_txt;

    public MainWeather getMain() {
        return main;
    }

    public void setMain(MainWeather main) {
        this.main = main;
    }

    public Wind getWind() {
        return wind;
    }

    public void setWind(Wind wind) {
        this.wind = wind;
    }

    public List<WeatherInfo> getWeather() {
        return weather;
    }

    public void setWeather(List<WeatherInfo> weather) {
        this.weather = weather;
    }

    public clouds getClouds() {
        return clouds;
    }

    public void setClouds(clouds clouds) {
        this.clouds = clouds;
    }

    public String getDt_txt() {
        return dt_txt;
    }

    public void setDt_txt(String dt_txt) {
        this.dt_txt = dt_txt;
    }
}