import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Nome, e-mail e código de acesso são obrigatórios." }, { status: 400 });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: "E-mail já está em uso na plataforma." }, { status: 409 });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert user into custom logos_polis.users table
    const { data: user, error: insertError } = await supabase
      .from('users')
      .insert([
        { 
          name, 
          email, 
          password_hash, 
          role: 'user', // Default role for new signups
          status: 'ativo' 
        }
      ])
      .select()
      .single();

    if (insertError || !user) {
      console.error(insertError);
      return NextResponse.json({ error: "Erro interno ao provisionar conta." }, { status: 500 });
    }

    // Create session cookie so the user is auto-logged in
    await createSession(user.id, user.role);

    return NextResponse.json({
      message: "Credencial estabelecida com sucesso.",
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    }, { status: 201 });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: "Erro catastrófico de conexão", details: err.message }, { status: 500 });
  }
}
