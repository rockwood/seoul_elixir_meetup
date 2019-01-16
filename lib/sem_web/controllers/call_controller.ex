defmodule SemWeb.CallController do
  use SemWeb, :controller

  def index(conn, _params) do
    render(conn)
  end
end
