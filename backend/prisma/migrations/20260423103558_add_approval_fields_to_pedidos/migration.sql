-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "aprovado_por" INTEGER,
ADD COLUMN     "motivo_reprovacao" TEXT;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "fk_pedidos_aprovados" FOREIGN KEY ("aprovado_por") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
