package com.example.weather.surveillance.dto;

public class OpenWeatherResponse {

    private String name;
    private MainWeather main;
    private Wind wind;

    // NEW FIELDS
    private coord coord;
    private WeatherInfo[] weather;
    private clouds clouds;
    private Sys sys;
    private int visibility;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

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

    // ===== NEW GETTERS & SETTERS =====

    public coord getCoord() {
        return coord;
    }

    public void setCoord(coord coord) {
        this.coord = coord;
    }

    public WeatherInfo[] getWeather() {
        return weather;
    }

    public void setWeather(WeatherInfo[] weather) {
        this.weather = weather;
    }

    public clouds getClouds() {
        return clouds;
    }

    public void setClouds(clouds clouds) {
        this.clouds = clouds;
    }

    public Sys getSys() {
        return sys;
    }

    public void setSys(Sys sys) {
        this.sys = sys;
    }

    public int getVisibility() {
        return visibility;
    }

    public void setVisibility(int visibility) {
        this.visibility = visibility;
    }
}