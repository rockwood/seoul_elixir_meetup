defmodule SemWeb.Router do
  use SemWeb, :router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_flash
    plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/", SemWeb do
    pipe_through :browser

    resources "/", CallController
  end

  # Other scopes may use custom stacks.
  # scope "/api", SemWeb do
  #   pipe_through :api
  # end
end
