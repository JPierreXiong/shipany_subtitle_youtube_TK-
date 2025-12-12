export function respData(data: any) {
  return respJson(0, 'ok', data || []);
}

export function respOk() {
  return respJson(0, 'ok');
}

export function respErr(message: string, status?: number) {
  const response = respJson(-1, message);
  if (status !== undefined) {
    return new Response(response.body, {
      status,
      headers: response.headers,
    });
  }
  return response;
}

export function respJson(code: number, message: string, data?: any) {
  let json = {
    code: code,
    message: message,
    data: data,
  };
  if (data) {
    json['data'] = data;
  }

  return Response.json(json);
}
