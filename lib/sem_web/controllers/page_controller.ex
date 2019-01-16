defmodule SemWeb.PageController do
  use SemWeb, :controller

  def index(conn, _params) do
    render(conn, "index.html")
  end
end
