defmodule Sem.Repo do
  use Ecto.Repo,
    otp_app: :sem,
    adapter: Ecto.Adapters.Postgres
end
