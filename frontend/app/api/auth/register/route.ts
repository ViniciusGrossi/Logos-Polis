import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createSession } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Nome, e-mail e código de acesso são obrigatórios." }, { status: 400 });
    }

    // The RPC creates the hash in Postgres without exposing the users table.
    const { data, error } = await supabase.schema('public').rpc('register_logos_polis_user', {
      p_name: name,
      p_email: email,
      p_password: password,
    });

    if (error?.code === '23505') {
      return NextResponse.json({ error: "E-mail já está em uso na plataforma." }, { status: 409 });
    }

    const user = data?.[0];
    if (error || !user) {
      console.error('Unable to register Logos Polis user:', error);
      return NextResponse.json({ error: "Erro interno ao provisionar conta." }, { status: 500 });
    }

    await createSession(user.id, user.role);

    return NextResponse.json({
      message: "Credencial estabelecida com sucesso.",
      user,
    }, { status: 201 });
  } catch (err: unknown) {
    console.error('Registration request failed:', err);
    return NextResponse.json({ error: "Erro catastrófico de conexão" }, { status: 500 });
  }
}
