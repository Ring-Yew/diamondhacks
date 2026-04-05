"""
Stage 3 — Price Forecast
Monte Carlo simulation to forecast flight price trends over the next 7 days.
"""
import numpy as np
from datetime import date, timedelta
from typing import TypedDict


class PricePoint(TypedDict):
    date: str
    price: float
    is_forecast: bool
    confidence_low: float | None
    confidence_high: float | None


def run_monte_carlo_forecast(
    history: list[float],
    days_ahead: int = 7,
    n_simulations: int = 1000,
) -> tuple[list[float], list[float], list[float]]:
    """
    Run Monte Carlo simulation based on historical daily price changes.
    Returns (mean_forecast, lower_5th_percentile, upper_95th_percentile).
    """
    if len(history) < 2:
        last = history[-1] if history else 500.0
        return (
            [last] * days_ahead,
            [last * 0.9] * days_ahead,
            [last * 1.1] * days_ahead,
        )

    # Daily log returns
    prices = np.array(history, dtype=float)
    log_returns = np.diff(np.log(prices))
    mu = float(np.mean(log_returns))
    sigma = float(np.std(log_returns))

    last_price = prices[-1]

    # Simulate n_simulations paths
    simulations = np.zeros((n_simulations, days_ahead))
    for i in range(n_simulations):
        path = [last_price]
        for _ in range(days_ahead):
            shock = np.random.normal(mu, sigma)
            path.append(path[-1] * np.exp(shock))
        simulations[i] = path[1:]

    means = simulations.mean(axis=0).tolist()
    lows = np.percentile(simulations, 5, axis=0).tolist()
    highs = np.percentile(simulations, 95, axis=0).tolist()

    return means, lows, highs


def build_forecast_response(
    route: str,
    history_prices: list[tuple[str, float]],  # list of (date_str, price)
    days_ahead: int = 7,
) -> list[PricePoint]:
    """
    Combine historical data and Monte Carlo forecast into a single time series.
    """
    points: list[PricePoint] = []

    for dt_str, price in history_prices:
        points.append(
            PricePoint(
                date=dt_str,
                price=round(price, 2),
                is_forecast=False,
                confidence_low=None,
                confidence_high=None,
            )
        )

    historical_prices_only = [p for _, p in history_prices]
    means, lows, highs = run_monte_carlo_forecast(historical_prices_only, days_ahead)

    if history_prices:
        last_date = date.fromisoformat(history_prices[-1][0])
    else:
        last_date = date.today()

    for i in range(days_ahead):
        forecast_date = last_date + timedelta(days=i + 1)
        points.append(
            PricePoint(
                date=forecast_date.isoformat(),
                price=round(means[i], 2),
                is_forecast=True,
                confidence_low=round(lows[i], 2),
                confidence_high=round(highs[i], 2),
            )
        )

    return points


def generate_mock_price_history(
    route: str,
    base_price: float = 500.0,
    days: int = 30,
) -> list[tuple[str, float]]:
    """Generate realistic-looking mock price history for demo purposes."""
    np.random.seed(abs(hash(route)) % (2**31))
    prices = [base_price]
    for _ in range(days - 1):
        change = np.random.normal(0, 0.02)
        prices.append(max(prices[-1] * np.exp(change), 50.0))

    today = date.today()
    return [
        ((today - timedelta(days=days - 1 - i)).isoformat(), round(p, 2))
        for i, p in enumerate(prices)
    ]
