export function handleError(error: unknown) {
  if (error instanceof Error) {
    alert(error.message);
  } else {
    alert('Ocurrió un error inesperado');
  }
}
