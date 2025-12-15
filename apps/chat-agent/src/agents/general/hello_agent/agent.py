from __future__ import annotations
from google.adk.agents import Agent


def get_weather(city: str) -> dict:
    """Retrieves the current weather report for a specified city.
    
    Args:
        city (str): The name of the city for which to retrieve the weather report.
    
    Returns:
        dict: A dictionary with 'status' and 'report' keys, or 'status' and 'error_message' keys.
    """
    city_lower = city.lower()
    
    weather_data = {
        "beijing": {
            "status": "success",
            "report": "The weather in Beijing is cloudy with a temperature of 18 degrees Celsius (64 degrees Fahrenheit)."
        },
        "shanghai": {
            "status": "success",
            "report": "The weather in Shanghai is sunny with a temperature of 22 degrees Celsius (72 degrees Fahrenheit)."
        },
        "guangzhou": {
            "status": "success",
            "report": "The weather in Guangzhou is rainy with a temperature of 26 degrees Celsius (79 degrees Fahrenheit)."
        },
        "shenzhen": {
            "status": "success",
            "report": "The weather in Shenzhen is partly cloudy with a temperature of 28 degrees Celsius (82 degrees Fahrenheit)."
        },
        "new york": {
            "status": "success",
            "report": "The weather in New York is sunny with a temperature of 25 degrees Celsius (77 degrees Fahrenheit)."
        },
        "london": {
            "status": "success",
            "report": "The weather in London is foggy with a temperature of 12 degrees Celsius (54 degrees Fahrenheit)."
        }
    }
    
    if city_lower in weather_data:
        return weather_data[city_lower]
    else:
        return {
            "status": "error",
            "error_message": f"Weather information for '{city}' is not available. Available cities: Beijing, Shanghai, Guangzhou, Shenzhen, New York, London."
        }


def calculator(expression: str) -> dict:
    """Performs mathematical calculations on a given expression.
    
    This calculator supports basic arithmetic operations: addition (+), subtraction (-),
    multiplication (*), division (/), and exponentiation (** or ^).
    
    Args:
        expression (str): A mathematical expression to evaluate (e.g., "2 + 2", "10 * 5 - 3").
    
    Returns:
        dict: A dictionary with 'status' and 'result' keys on success, or 'status' and 'error_message' keys on failure.
    """
    try:
        expression = expression.replace("^", "**")
        
        allowed_chars = set("0123456789+-*/.() ")
        if not all(c in allowed_chars for c in expression):
            return {
                "status": "error",
                "error_message": "Expression contains invalid characters. Only numbers, +, -, *, /, (, ) are allowed."
            }
        
        result = eval(expression)
        
        return {
            "status": "success",
            "result": float(result) if isinstance(result, (int, float)) else result,
            "expression": expression
        }
    except ZeroDivisionError:
        return {
            "status": "error",
            "error_message": "Division by zero is not allowed."
        }
    except SyntaxError as e:
        return {
            "status": "error",
            "error_message": f"Invalid expression syntax: {str(e)}"
        }
    except Exception as e:
        return {
            "status": "error",
            "error_message": f"Calculation error: {str(e)}"
        }


root_agent = Agent(
    name="hello_assistant",
    model="gemini-2.5-flash",
    description="A friendly AI assistant with weather and calculator tools",
    instruction=(
        "You are a warm and helpful assistant equipped with weather query and calculator tools. "
        "When users ask about weather, use the get_weather tool to provide accurate information. "
        "When users need calculations, use the calculator tool to solve mathematical expressions. "
        "Always be conversational and friendly, and clearly explain the results to users."
    ),
    tools=[get_weather, calculator],
)
